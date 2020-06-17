const { connectToReticulum } = require("./phoenix-utils");
const AuthChannel = require("./auth-channel");
const Store = require("./store");

const store = new Store();
//   {
//   email: process.env.ADMIN_EMAIL,
//   token: process.env.ADMIN_TOKEN,
// }
const authChannel = new AuthChannel(store);

module.exports = async (link) => {
  const url = new URL(link);
  if (!authChannel.socket) authChannel.setSocket(await connectToReticulum());
  try {
    await authChannel.verifyAuthentication(
      url.searchParams.get("auth_topic"),
      url.searchParams.get("auth_token"),
      url.searchParams.get("auth_payload")
    );
    return { res: true };
  } catch (e) {
    // Error during verification, likely invalid/expired token
    return { err: e };
  }
};
