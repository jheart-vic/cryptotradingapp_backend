import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const auth = async (req, res, next) => {
  const token = req.header('Authorization')
  if (!token) return res.status(401).json({ msg: 'No token, auth denied' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next()
  } catch {
    return res.status(401).json({ msg: 'Token invalid' })
  }
}



// middleware/isAdmin.js
export default function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admins only' })
  }
  next()
}
