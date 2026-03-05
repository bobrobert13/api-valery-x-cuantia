const handleHttpError = async (
  req,
  res,
  err = "ERROR",
  code = 400,
  params,
  message = "HA OCURRIDO UN ERROR DE RUTA"
) => {
  req.Logger.error(message, err, params);

  res.status(code).json({ ERROR: err });
};

export { handleHttpError };
