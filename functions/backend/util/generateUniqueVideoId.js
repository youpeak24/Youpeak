const generateRandomString = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
};

const generateUniqueVideoId = () => {
  const randomLetters = generateRandomString(5);
  const randomNumbers = generateRandomString(5);
  return `${randomLetters}${randomNumbers}`;
};

module.exports = { generateUniqueVideoId };
