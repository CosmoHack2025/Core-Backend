const { serialize } = require("cookie");
const setTokenCookie = (res, token) => {
  res.setHeader("Set-Cookie", [
    serialize("token", token, {
    // domain:".pixbit.me",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  ]);
};

module.exports = setTokenCookie;