const roleMiddleware = (roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Unauthorized Access! You are not authorized to access this resource",
        });
      }
      next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};

module.exports = { roleMiddleware };
  