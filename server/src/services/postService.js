import mongoose from "mongoose";
import Post from "../models/Post.js";

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  mostLiked: { likesCount: -1, createdAt: -1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const presentPost = (post, userId) => {
  const viewer = userId ? String(userId) : null;
  const authorId = post.author?._id
    ? String(post.author._id)
    : String(post.author);
  const likes = (post.likes || []).map(String);
  const dislikes = (post.dislikes || []).map(String);

  return {
    id: String(post._id),
    title: post.title,
    content: post.content,
    isPublic: post.isPublic,
    author: {
      id: authorId,
      name: post.author?.name || "Unknown",
    },
    likesCount: post.likesCount ?? likes.length,
    dislikesCount: post.dislikesCount ?? dislikes.length,
    liked: viewer ? likes.includes(viewer) : false,
    disliked: viewer ? dislikes.includes(viewer) : false,
    isOwner: viewer === authorId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
};

const visibilityFilter = (userId) => {
  if (!userId) return { isPublic: true };
  return { $or: [{ isPublic: true }, { author: userId }] };
};

const scopeFilter = (userId, mine) => {
  if (!mine) return visibilityFilter(userId);
  if (!userId) throw httpError(401, "Log in to see your posts");
  return { author: userId };
};

export const listPosts = async ({ search, sort, page, limit, mine }, userId) => {
  const clauses = [scopeFilter(userId, mine)];

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    clauses.push({ $or: [{ title: pattern }, { content: pattern }] });
  }

  const filter = clauses.length === 1 ? clauses[0] : { $and: clauses };
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip(skip)
      .limit(limit)
      .populate("author", "name"),
    Post.countDocuments(filter),
  ]);

  return {
    posts: posts.map((post) => presentPost(post, userId)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const loadReadablePost = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid id");

  const post = await Post.findById(id).populate("author", "name");
  if (!post) throw httpError(404, "Post not found");

  const ownerId = String(post.author?._id || post.author);
  if (!post.isPublic && ownerId !== String(userId || "")) {
    throw httpError(404, "Post not found");
  }

  return post;
};

export const getPost = async (id, userId) => {
  const post = await loadReadablePost(id, userId);
  return presentPost(post, userId);
};

export const createPost = async ({ title, content, isPublic }, userId) => {
  const post = await Post.create({
    title,
    content,
    isPublic,
    author: userId,
  });
  await post.populate("author", "name");
  return presentPost(post, userId);
};

const loadOwnedPost = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, "Invalid id");

  const post = await Post.findById(id);
  if (!post) throw httpError(404, "Post not found");
  if (String(post.author) !== String(userId)) {
    throw httpError(403, "You can only change your own posts");
  }
  return post;
};

export const updatePost = async (id, { title, content, isPublic }, userId) => {
  const post = await loadOwnedPost(id, userId);
  post.title = title;
  post.content = content;
  post.isPublic = isPublic;
  await post.save();
  await post.populate("author", "name");
  return presentPost(post, userId);
};

export const deletePost = async (id, userId) => {
  const post = await loadOwnedPost(id, userId);
  await post.deleteOne();
  return { message: "Post deleted" };
};

export const reactToPost = async (id, userId, type) => {
  const post = await loadReadablePost(id, userId);
  const viewer = String(userId);
  const hasLike = post.likes.some((like) => String(like) === viewer);
  const hasDislike = post.dislikes.some(
    (dislike) => String(dislike) === viewer,
  );

  if (type === "like") {
    if (hasLike) post.likes.pull(userId);
    else {
      post.likes.addToSet(userId);
      if (hasDislike) post.dislikes.pull(userId);
    }
  } else if (hasDislike) {
    post.dislikes.pull(userId);
  } else {
    post.dislikes.addToSet(userId);
    if (hasLike) post.likes.pull(userId);
  }

  post.likesCount = post.likes.length;
  post.dislikesCount = post.dislikes.length;
  await post.save();
  await post.populate("author", "name");
  return presentPost(post, userId);
};

// Same result as listPosts, but one aggregation does the filter, sort,
// pagination, author lookup, and total count.
export const listPostsAggregation = async (
  { search, sort, page, limit, mine },
  userId,
) => {
  const skip = (page - 1) * limit;
  const viewerId = userId ? new mongoose.Types.ObjectId(String(userId)) : null;
  const match = { $and: [scopeFilter(viewerId, mine)] };

  // Search title or content without treating the typed text as a regex pattern.
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    match.$and.push({ $or: [{ title: pattern }, { content: pattern }] });
  }

  const [result] = await Post.aggregate([
    // All posts the viewer may see, or only that viewer's posts when mine is set.
    { $match: match },
    {
      $facet: {
        posts: [
          { $sort: SORTS[sort] || SORTS.newest },
          { $skip: skip },
          { $limit: limit },
          // Author is stored as an id. Join the users collection for the name.
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              title: 1,
              content: 1,
              isPublic: 1,
              author: {
                id: { $toString: "$author._id" },
                name: { $ifNull: ["$author.name", "Unknown"] },
              },
              likesCount: {
                $ifNull: ["$likesCount", { $size: { $ifNull: ["$likes", []] } }],
              },
              dislikesCount: {
                $ifNull: [
                  "$dislikesCount",
                  { $size: { $ifNull: ["$dislikes", []] } },
                ],
              },
              liked: viewerId
                ? { $in: [viewerId, { $ifNull: ["$likes", []] }] }
                : { $literal: false },
              disliked: viewerId
                ? { $in: [viewerId, { $ifNull: ["$dislikes", []] }] }
                : { $literal: false },
              isOwner: viewerId
                ? { $eq: ["$author._id", viewerId] }
                : { $literal: false },
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        // Count every matched post, not only the current page.
        totalCount: [{ $count: "total" }],
      },
    },
  ]);

  const total = result?.totalCount[0]?.total || 0;

  return {
    posts: result?.posts || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
