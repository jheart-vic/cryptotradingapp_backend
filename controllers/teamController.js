export const getMyTeam = async (req, res) => {
  try {
    const result = await getReferralTree(req.user._id)
    if (!result) return res.status(404).json({ msg: 'Team not found' })
    res.json(result)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
