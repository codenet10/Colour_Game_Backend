import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import stringConstructor from '../constructor/stringConstructor.js';
import awsS3Obj from '../helper/awsS3.js';
import { Slider } from '../models/slider.model.js';

// const globalUsernames = [];

export const AdminController = {
  createAdmin: async (data) => {
    try {
      if (!data.userName) {
        throw { message: 'userName Is Required' };
      }
      if (!data.password) {
        throw { message: 'Password Is Required' };
      }
      const existingAdmin = await Admin.findOne({ userName: data.userName });
      if (existingAdmin) {
        throw { code: 409, message: 'Admin Already Exists' };
      }

      const Passwordsalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(data.password, Passwordsalt);

      const newAdmin = new Admin({
        userName: data.userName,
        password: encryptedPassword,
        roles: data.roles,
      });

      await newAdmin.save();
    } catch (err) {
      console.error(err);
      throw { code: 500, message: 'Failed to save user' };
    }
  },

  //create user

  GenerateAccessToken: async (userName, password) => {
    if (!userName) {
      throw { code: 400, message: 'Invalid userName' };
    }
    if (!password) {
      throw { code: 400, message: 'Invalid password' };
    }
    const existingUser = await Admin.findOne({ userName: userName });

    if (!existingUser) {
      throw { code: 400, message: 'Invalid userName or Password' };
    }
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
      throw { code: 401, message: 'Invalid userName or Password' };
    }
    const accessTokenResponse = {
      id: existingUser._id,
      userName: existingUser.userName,
    };
    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });
    return {
      userName: existingUser.userName,
      accessToken: accessToken,
    };
  },

  createUser: async (data) => {
    try {
      if (!data.firstName) {
        throw { message: 'firstName Is Required' };
      }
      if (!data.lastName) {
        throw { message: 'lastName Is Required' };
      }
      if (!data.userName) {
        throw { message: 'userName Is Required' };
      }
      if (!data.phoneNumber) {
        throw { message: 'phoneNumber Is Required' };
      }
      if (!data.password) {
        throw { message: 'Password Is Required' };
      }
      const existingUser = await User.findOne({ userName: data.userName });
      if (existingUser) {
        throw { code: 409, message: 'User Already Exists' };
      }
      const Passwordsalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(data.password, Passwordsalt);
      const newUser = new User({
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        phoneNumber: data.phoneNumber,
        password: encryptedPassword,
        roles: 'User',
      });
      await newUser.save();
    } catch (error) {
      console.log(error);
      throw { code: 500, message: error.message || 'Failed to save user' };
    }
  },

  loginUser: async (userName, password) => {
    if (!userName) {
      throw { code: 400, message: 'Invalid userName' };
    }
    if (!password) {
      throw { code: 400, message: 'Invalid password' };
    }
    const existingUser = await User.findOne({ userName: userName });
    if (!existingUser) {
      throw { code: 400, message: 'Invalid userName or Password' };
    }
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      throw { code: 401, message: 'Invalid userName or Password' };
    }
    const accessTokenResponse = {
      id: existingUser._id,
      userName: existingUser.userName,
      isEighteen: existingUser.eligibilityCheck,
    };
    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });
    return {
      userName: existingUser.userName,
      accessToken: accessToken,
      isEighteen: existingUser.eligibilityCheck,
    };
  },

  createGame: async (gameName, Description) => {
    try {
      const existingGame = await Admin.findOne({
        'gameList.gameName': gameName,
      });

      if (existingGame) {
        throw { code: 400, message: 'Game name already exists' };
      }
      const admin = await Admin.findOne(stringConstructor.StringConst);

      console.log('Game  ' + admin);
      if (!admin) {
        throw { code: 404, message: 'Admin Not Found' };
      }

      admin.gameList.push({
        gameId: new mongoose.Types.ObjectId(),
        gameName: gameName,
        Description: Description,
        markets: [],
      });

      await admin.save();

      return {
        gameList: admin.gameList,
      };
    } catch (error) {
      throw error;
    }
  },

  createMarket: async (gameId, marketName, participants, timeSpan) => {
    try {
      const market = await Admin.findOne(stringConstructor.StringConst);

      if (!market) {
        throw { code: 404, message: 'Admin not found' };
      }

      const game = market.gameList.find((game) => String(game.gameId) === String(gameId));

      console.log('game', game);

      if (!game) {
        throw { message: 'Game not found' };
      }

      const newMarket = {
        marketId: new mongoose.Types.ObjectId(),
        marketName: marketName,
        participants: participants,
        timeSpan: timeSpan,
        runners: [],
      };

      game.markets.push(newMarket);

      await market.save();

      return {
        gameList: market.gameList,
      };
    } catch (error) {
      throw error;
    }
  },

  createRunner: async (gameId, marketId, runnerNames) => {
    try {
      const runner = await Admin.findOne(stringConstructor.StringConst);

      if (!runner) {
        throw { code: 404, message: 'Admin not found' };
      }
      const game = runner.gameList.find((game) => String(game.gameId) === String(gameId));
      // const game = admin.gameList.find((game) => game.gameName === gameName);

      if (!game) {
        throw { message: 'Game not found' };
      }

      const market = game.markets.find((market) => String(market.marketId) === String(marketId));

      if (!market) {
        throw { message: 'Market not found' };
      }

      const maxParticipants = market.participants;

      if (runnerNames.length > maxParticipants) {
        throw { message: 'Number of runners exceeds the maximum allowed participants.' };
      }

      const newRunners = runnerNames.map((runnerName) => {
        const runnerId = new mongoose.Types.ObjectId();
        const name = runnerName;
        return {
          runnerName: { runnerId, name },
          rate: {
            Back: 0,
            Lay: 0,
          },
        };
      });

      market.runners.push(...newRunners);

      await runner.save();

      return {
        gameList: runner.gameList,
      };
    } catch (error) {
      throw error;
    }
  },

  createRate: async (gameId, marketId, runnerId, back, lay) => {
    try {
      const rate = await Admin.findOne(stringConstructor.StringConst);

      if (!rate) {
        throw { code: 404, message: 'Admin not found' };
      }
      const game = rate.gameList.find((game) => String(game.gameId) === String(gameId));
      // const game = admin.gameList.find((game) => game.gameName === gameName);

      if (!game) {
        throw { message: 'Game not found' };
      }
      const market = game.markets.find((market) => String(market.marketId) === String(marketId));
      // const market = game.markets.find((market) => market.marketName === marketName);

      if (!market) {
        throw { message: 'Market not found' };
      }

      const runnerToUpdate = market.runners.find((runner) => String(runner.runnerName.runnerId) === String(runnerId));

      if (runnerToUpdate) {
        runnerToUpdate.rate[0].Back = back;
        runnerToUpdate.rate[0].Lay = lay;

        await rate.save();

        return {
          gameList: rate.gameList,
        };
      } else {
        throw { message: 'Runner not found' };
      }
    } catch (error) {
      throw error;
    }
  },

  checkMarketStatus: async (marketId, status) => {
    try {
      if (typeof status !== 'boolean') {
        throw new Error('Invalid status format. It should be a boolean.');
      }

      const admin = await Admin.findOne({ 'gameList.markets.marketId': marketId });

      if (!admin) {
        throw new Error('Market not found.');
      }

      let currentStatus;

      admin.gameList.forEach((game) => {
        game.markets.forEach((market) => {
          if (market.marketId.equals(marketId)) {
            market.status = status;
            currentStatus = market.status;
          }
        });
      });

      await admin.save();

      const statusMessage = currentStatus ? 'Market is active.' : 'Market is suspended.';

      return { currentStatus: statusMessage };
    } catch (error) {
      throw error;
    }
  },

  //   buildRootPath: async (gameName, marketName, runnerName, action) => {
  //     try {
  //         let user;

  //         if (gameName) {
  //             user = await Admin.findOne({ 'gameList.gameName': gameName });
  //         } else if (marketName) {
  //             user = await Admin.findOne({ 'gameList.markets.marketName': marketName });
  //         } else if (runnerName) {
  //             user = await Admin.findOne({ 'gameList.markets.runners.runnerName.name': runnerName });
  //         }

  //         if (!user) {
  //             throw { code: 404, message: 'User not found for the specified criteria' };
  //         }

  //         let totalPages = 1;
  //         let currentPage = 1;

  //         if (action === 'store') {
  //             let path = user.path || '';

  //             if (gameName || marketName || runnerName) {
  //                 const newPath = path.split('/');
  //                 const nameIndex = newPath.indexOf(gameName || marketName || runnerName);

  //                 if (nameIndex !== -1) {
  //                     newPath.splice(nameIndex + 1);
  //                     path = newPath.join('/');
  //                 } else {
  //                     path += '/' + (gameName || marketName || runnerName);
  //                 }
  //             }

  //             const currentPath = path.replace(/^\//, '');

  //             user.path = currentPath;
  //             await user.save();

  //             const totalItems = 1;

  //             return { message: 'Path stored successfully', path: [currentPath], totalPages, totalItems };
  //         } else if (action === 'clear') {

  //             user.path = '';
  //             await user.save();
  //         } else if (action === 'clearAll') {
  //             // Clear all paths
  //             user.path = '';
  //             await user.save();
  //         } else {
  //             throw { code: 400, message: 'Invalid action provided' };
  //         }

  //         const successMessage =
  //             action === 'store' ? 'Path stored successfully' : 'Path cleared successfully';
  //         return { message: successMessage, path: [user.path], totalPages, totalItems: 1 };
  //     } catch (err) {
  //         console.error(err);
  //         throw { code: err.code || 500, message: err.message || 'Internal Server Error' };
  //     }
  // },

  updateGame: async (admin, gameId, gameName, description) => {
    const game = admin.gameList.find((game) => String(game.gameId) === String(gameId));

    if (!game) {
      throw { message: 'Game not found....' };
    }

    game.gameName = gameName || game.gameName;
    game.Description = description || game.Description;
  },

  updateMarket: async (admin, gameId, marketId, marketName, participants, timeSpan) => {
    const game = admin.gameList.find((game) => String(game.gameId) === String(gameId));

    if (!game) {
      throw { message: 'Game not found for market' };
    }

    const market = game.markets.find((market) => String(market.marketId) === String(marketId));

    if (!market) {
      throw { message: 'Market not found' };
    }

    market.marketName = marketName || market.marketName;
    market.participants = participants || market.participants;
    market.timeSpan = timeSpan || market.timeSpan;
  },

  updateRunner: async (admin, gameId, marketId, runnerId, RunnerName) => {
    const game = admin.gameList.find((game) => String(game.gameId) === String(gameId));

    if (!game) {
      throw { message: 'Game not found for runner' };
    }

    const market = game.markets.find((market) => String(market.marketId) === String(marketId));

    if (!market) {
      throw { message: 'Market not found for runner' };
    }

    const runnerToUpdate = market.runners.find((runner) => String(runner.runnerName.runnerId) === String(runnerId));

    if (!runnerToUpdate) {
      throw { message: 'Runner not found' };
    }

    runnerToUpdate.runnerName.name = RunnerName;

    await admin.save();
  },

  updateRate: async (admin, gameId, marketId, runnerId, back, lay) => {
    const game = admin.gameList.find((game) => String(game.gameId) === String(gameId));

    if (!game) {
      throw { message: 'Game not found for rate' };
    }

    const market = game.markets.find((market) => String(market.marketId) === String(marketId));

    if (!market) {
      throw { message: 'Market not found for rate' };
    }

    const runnerToUpdate = market.runners.find((runner) => String(runner.runnerName.runnerId) === String(runnerId));

    if (!runnerToUpdate) {
      throw { message: 'Runner not found for rate' };
    }

    runnerToUpdate.rate[0].Back = back || runnerToUpdate.rate[0].Back;
    runnerToUpdate.rate[0].Lay = lay || runnerToUpdate.rate[0].Lay;
  },

  CreateSlider: async (sliderCount, data, user) => {
    try {
      // Check if data is an array
      if (!Array.isArray(data)) {
        throw { code: 400, message: 'Data must be an array' };
      }
      let documentArray = [];
      for (const element of data) {
        let obj = {};
        const result = await awsS3Obj.addDocumentToS3(element.docBase, element.name, 'game-slider', element.doctype);
        obj.image = result.Location;
        obj.text = element.text;
        obj.headingText = element.headingText;
        documentArray.push(obj);
      }
      const newSlider = new Slider({
        sliderCount: sliderCount,
        document: documentArray,
      });
      const savedSlider = await newSlider.save();
      console.log('Saved slider:', savedSlider);
      return true;
    } catch (err) {
      console.error('Error in CreateSlider:', err);
      throw { code: err.code || 500, message: err.message || 'Failed to Create Sliders' }; // Fallback to generic error response
    }
  }
};
