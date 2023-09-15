require('dotenv').config();
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import bcrypt = require('bcryptjs');
import jwt = require('jsonwebtoken');
import * as passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { JWTData } from '../types/JWTData';

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['r_emailaddress', 'r_liteprofile'],
    },
    async function (accessToken, refreshToken, profile, done) {
      const userRepository = AppDataSource.getRepository(User);

      let currentUser = await userRepository.findOne({
        where: { email: profile.emails[0].value },
      });

      if (!currentUser) {
        const user = {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: bcrypt.hashSync(profile.id, 10),
        };
        currentUser = await userRepository.save(user);
      }

      const currentDate = new Date();
      const expirationDate = new Date(
        currentDate.getTime() +
          Number(process.env.JWT_EXPIRATION_TIME.replace('m', '')) * 60000
      );

      const data: JWTData = {
        username: currentUser.name,
        email: currentUser.email,
        isAdmin: currentUser.isAdmin,
        isTeacher: currentUser.isTeacher,
        iat: currentDate.getTime(),
        exp: expirationDate.getTime(),
      };

      const token = jwt.sign(data, process.env.JWT_SECRET);

      console.log('XXXX', token);
      return done(null, token);
    }
  )
);

// Serializa el usuario para almacenar solo su ID en la sesión.
passport.serializeUser(function (user, done) {
  // done(null, user.id);
  done(null, user);
});

// Deserializa el usuario para obtener la información completa a partir de su ID almacenado en la sesión.
passport.deserializeUser(function (id, done) {
  // Aquí puedes buscar el usuario en la base de datos utilizando el ID y devolverlo.
  // Por ejemplo, si estás utilizando MongoDB:
  // User.findById(id, function (err, user) {
  //   done(err, user);
  // });
  done(null, { id }); // En este ejemplo, simplemente devolvemos un objeto con el ID como representación del usuario.
});

export default passport;
