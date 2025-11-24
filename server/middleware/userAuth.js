import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({
      success: false,
      message: "Not Unauthorized.login Again",
    });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDecode.id) {
         req.userId = tokenDecode.id; // store userId safely, not in body
         } else {
            return res.json({
             success: false,
              message: "Token is not Authorized, login again",
         });
        }


    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
