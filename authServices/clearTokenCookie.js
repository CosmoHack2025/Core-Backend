const { serialize } = require("cookie");
const clearTokenCookie = (res) => {
  res.setHeader("Set-Cookie", [
    serialize("token", "", {
    // domain:".pixbit.me",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    }),
  ]);
};

module.exports = clearTokenCookie;
