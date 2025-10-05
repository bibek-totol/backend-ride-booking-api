
export const maskToken = (token: string): string => {
  if (!token) return "";
  if (token.length <= 7) return token;
  const start = token.slice(0, 3);
  const end = token.slice(-4);
  return `${start}...${end}`;
};
