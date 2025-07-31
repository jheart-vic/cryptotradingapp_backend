import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const auth = async (req, res, next) => {
  const header = req.header('Authorization')
  if (!header) return res.status(401).json({ msg: 'No token, auth denied' })

  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : header

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    if (!req.user) return res.status(401).json({ msg: 'User not found' })
    next()
  } catch {
    return res.status(401).json({ msg: 'Token invalid' })
  }
}

// middleware/isAdmin.js
export  const isAdmin = (req, res, next) =>{
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admins only' })
  }
  next()
}
