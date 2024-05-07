import passport from 'passport';

// google authentication
const googleLoginController = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleAuthCallbackController = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      const errorMessage = 'Failed to authenticate with Google. Please try again later.';
      const redirectUrl = `${process.env.FRONTEND_URI}/login?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(redirectUrl);
    }

    const options = {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Set 'secure' based on request protocol
    };

    res.cookie('accessToken', user.accessToken, options);
    res.cookie('refreshToken', user.refreshToken, options);
    return res.redirect(process.env.FRONTEND_URI);
  })(req, res, next);
};

// facebook authentication
const facebookLoginController = passport.authenticate('facebook', { scope: ['profile', 'email'] });

const facebookAuthCallbackController = (req, res, next) => {
  passport.authenticate('facebook', (err, user, info) => {
    if (err) {
      const errorMessage = 'Failed to authenticate with Facebook. Please try again later.';
      const redirectUrl = `${process.env.FRONTEND_URI}/login?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(redirectUrl);
    }

    const options = {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Set 'secure' based on request protocol
    };

    res.cookie('accessToken', user.accessToken, options);
    res.cookie('refreshToken', user.refreshToken, options);
    return res.redirect(process.env.FRONTEND_URI);
  })(req, res, next);
};

// github authentication
const githubLoginController = passport.authenticate('github', { scope: ['profile', 'email'] });

const githubAuthCallbackController = (req, res, next) => {
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      const errorMessage = 'Failed to authenticate with Github. Please try again later.';
      const redirectUrl = `${process.env.FRONTEND_URI}/login?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(redirectUrl);
    }

    const options = {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Set 'secure' based on request protocol
    };

    res.cookie('accessToken', user.accessToken, options);
    res.cookie('refreshToken', user.refreshToken, options);
    return res.redirect(process.env.FRONTEND_URI);
  })(req, res, next);
};

export {
  googleLoginController,
  googleAuthCallbackController,
  facebookLoginController,
  facebookAuthCallbackController,
  githubLoginController,
  githubAuthCallbackController,
};
