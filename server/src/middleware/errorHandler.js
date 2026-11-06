const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      status: 409,
      message: "An account with this email already exists",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      status: 400,
      message: "Invalid id",
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    status,
    message: status === 500 ? "Something went wrong" : err.message,
  });
};

export default errorHandler;
