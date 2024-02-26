import { UserController } from '../controller/user.controller.js';
import { Admin } from '../models/admin.model.js';
import { User } from '../models/user.model.js';
import { mongoose } from 'mongoose';
import {Authorize} from '../middleware/auth.js'

export const UserRoute = (app) => {
  app.get('/api/user-games',Authorize(['User']), async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';

      const admins = await Admin.find();

      if (!admins || admins.length === 0) {
        throw { code: 404, message: 'Admin not found' };
      }

      const gameData = admins.flatMap((admin) =>
        admin.gameList.map((game) => ({
          gameId: game.gameId,
          gameName: game.gameName,
          Description: game.Description,
        })),
      );

      const filteredGameData = gameData.filter(
        (game) => game.gameName && game.gameName.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      const totalItems = filteredGameData.length;

      let paginatedGameData;
      let totalPages = 1;

      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedGameData = filteredGameData.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedGameData = filteredGameData;
      }

      res.status(200).send({
        games: paginatedGameData,
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      });
    } catch (error) {
      res.status(500).send({
        code: error.code || 500,
        message: error.message || 'Internal Server Error',
      });
    }
  });

  app.get('/api/user-markets/:gameId',Authorize(['User']), async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';

      const admins = await Admin.findOne(
        { 'gameList.gameId': gameId },
        { _id: 0, gameList: { $elemMatch: { gameId: gameId } } },
      ).exec();

      if (!admins || !admins.gameList || !Array.isArray(admins.gameList)) {
        throw { code: 404, message: 'Game not found' };
      }
      console.log('first', admins);

      const marketDetails = admins.gameList.flatMap((game) =>
        game.markets
          .filter((market) => market.marketName.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((market) => ({
            marketId: market.marketId,
            marketName: market.marketName,
            timeSpan: market.timeSpan,
            participants: market.participants,
            status: market.status,
          })),
      );

      const marketData = [].concat(...marketDetails);

      let paginatedMarketData;
      let totalPages = 1;

      if (page && pageSize) {
        const totalItems = marketData.length;
        totalPages = Math.ceil(totalItems / pageSize);

        paginatedMarketData = marketData.slice((page - 1) * pageSize, page * pageSize);
      } else {
        paginatedMarketData = marketData;
      }

      res.status(200).send({
        markets: paginatedMarketData,
        currentPage: page,
        totalPages: totalPages,
        totalItems: marketData.length,
      });
    } catch (error) {
      res.status(500).send({
        code: error.code || 500,
        message: error.message || 'Internal Server Error',
      });
    }
  });

  app.get('/api/user-runners/:gameId/:marketId',Authorize(['User']), async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const marketId = new mongoose.Types.ObjectId(req.params.marketId);
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';

      console.log('Received request for gameId:', gameId, 'and marketId:', marketId);

      const admin = await Admin.findOne(
        {
          'gameList.gameId': gameId,
          'gameList.markets.marketId': marketId,
        },
        { _id: 0, 'gameList.$': 1 },
      );
      console.log('Admin found:', admin);

      if (!admin || !admin.gameList || admin.gameList.length === 0) {
        throw { code: 404, message: 'Game not found for the specified Admin' };
      }

      const game = admin.gameList[0];
      console.log('Game found:', game);

      const market = game.markets.find((m) => m.marketId.equals(marketId));
      console.log('Market found:', market);

      if (!market) {
        throw { code: 404, message: 'Market not found for the specified Game' };
      }

      const filteredRunners = market.runners.filter(
        (runner) => runner.runnerName.name && runner.runnerName.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      const totalItems = filteredRunners.length;
      const totalPages = Math.ceil(totalItems / pageSize);

      const paginatedRunners = filteredRunners.slice((page - 1) * pageSize, page * pageSize);

      const runnerNamesList = paginatedRunners.map((runner) => ({
        runnerId: runner.runnerName.runnerId,
        runnerName: runner.runnerName.name,
        rates: runner.rate.map((rate) => ({
          Back: rate.Back,
          Lay: rate.Lay,
        })),
      }));

      res.status(200).send({
        runners: runnerNamesList,
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      });
    } catch (error) {
      res.status(error.code || 500).send({
        code: error.code || 500,
        message: error.message || 'Internal Server Error',
      });
    }
  });

  app.post('/api/eligibilityCheck/:userId',Authorize(['User']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { eligibilityCheck } = req.body;
      const check = await UserController.eligibilityCheck(userId, eligibilityCheck);
      res.status(200).send({ code: 200, message: 'ok', check });
    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message });
    }
  });
  app.get('/api/User-Details',Authorize(['User']), async (req, res) => {
    try {
      const users = await User.find();

      if (!users || users.length === 0) {
        throw { code: 404, message: 'User not found' };
      }

      res.status(200).send({ code: 200, message: users });
    } catch (error) {
      res.status(error.code || 500).send({
        code: error.code || 500,
        message: error.message || 'Internal Server Error',
      });
    }
  });
};
