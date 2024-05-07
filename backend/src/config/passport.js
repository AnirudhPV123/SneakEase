import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GithubStrategy } from 'passport-github2';
import passport from 'passport';
import { logger } from '../utils/logger.js';

import { loginWithAuthProviders } from '../controllers/auth.controller.js';
import { CustomError } from '../utils/CustomError.js';

// google config
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Validate profile data
        if (!profile || !profile.id) {
          throw new CustomError(400, 'Invalid Google profile data');
        }

        // Attempt user authentication
        const user = await loginWithAuthProviders({
          provider: 'google',
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          photos: profile.photos?.[0]?.value || null,
        });

        if (!user) {
          throw new CustomError(500, 'Failed to authenticate user with Google');
        }

        // Authentication successful
        done(null, user);
      } catch (error) {
        if (error instanceof CustomError) {
          // Custom error handling
          done(error);
        } else {
          // Log unexpected errors
          logger.error('Error in Google authentication:', error);
          done(error);
        }
      }
    },
  ),
);

// facebook config
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/api/v1/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'email', 'photos'],
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Validate profile data
        if (!profile || !profile.id) {
          throw new CustomError(400, 'Invalid Facebook profile data');
        }

        // Attempt user authentication
        const user = await loginWithAuthProviders({
          provider: 'facebook',
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          photos: profile.photos?.[0]?.value || null,
        });

        if (!user) {
          throw new CustomError(500, 'Failed to authenticate user with Facebook');
        }

        // Authentication successful
        done(null, user);
      } catch (error) {
        if (error instanceof CustomError) {
          // Custom error handling
          done(error);
        } else {
          // Log unexpected errors
          logger.error('Error in Facebook authentication:', error);
          done(error);
        }
      }
    },
  ),
);

// github config
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/github/callback',
      scope: ['user:email'],
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Validate profile data
        if (!profile || !profile.id) {
          throw new CustomError(400, 'Invalid Github profile data');
        }

        // Attempt user authentication
        const user = await loginWithAuthProviders({
          provider: 'github',
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          photos: profile.photos?.[0]?.value || null,
        });

        if (!user) {
          throw new CustomError(500, 'Failed to authenticate user with Github');
        }

        // Authentication successful
        done(null, user);
      } catch (error) {
        if (error instanceof CustomError) {
          // Custom error handling
          done(error);
        } else {
          // Log unexpected errors
          logger.error('Error in Github authentication:', error);
          done(error);
        }
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
