const {v4: uuidv4 } = require('uuid');
const express = require('express');
import UsersDatabase from '@shared/models/user_logins/users_db';
import UserDetailsDatabase from '@shared/models/user_details/user_details_db';
import * as appTypes from '@appTypes/appTypes'

const usersContentRouter = express.Router();

usersContentRouter.use(express.json());



module.exports = usersContentRouter;