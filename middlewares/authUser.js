// import jwt from 'jsonwebtoken';
// const authUser = async (req, res, next) => {
//   const { token } = req.cookies;
//   if (!token) {
//     return res.json({ success: false, message: "Not Authorized" });
//   }
//   try {
//     const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
//     if(tokenDecode.id) {
//         req.userId = tokenDecode.id;
//         next();
//     } else {
//         return res.json({ success: false, message: "Not Authorized" });
//     }
//     // next();
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// export default authUser;
// middleware/authUser.js
import jwt from 'jsonwebtoken';

const authUser = (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const token = req.cookies?.token || bearer;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    req.userId = decoded.id;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export default authUser;
