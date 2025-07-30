const calculateProfit = (amount, duration) => {
  let percent = 0;
  if (duration === 60) percent = 1.5;
  else if (duration === 120) percent = 3;
  else if (duration === 180) percent = 5;

  const profit = (amount * percent) / 100;
  return { profit, percent };
};
