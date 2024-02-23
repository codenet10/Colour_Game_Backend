
import { AdminController } from "../controller/admin.controller.js";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";
import {Authorize} from "../middleware/auth.js";
import { mongoose } from "mongoose";
import { errorHandler , notFound } from "../middleware/ErrorHandling.js";
import { verifyJWT } from "../middleware/JWTVerify.js";
import { isAdmin } from "../middleware/isAdmin.js";


export const AdminRoute = (app) => {

    app.post("/api/admin-create",
    async (req, res) => {
        try {
            const user = req.user; 
            await AdminController.createAdmin(req.body, user);
            res.status(200).send({ code: 200, message: 'Admin registered successfully!' })
        }
        catch (err) {
            res.status(500).send({ code: err.code, message: err.message })
        }
    });

  app.post("/api/admin-login", async (req, res) => {
    try {
      const { userName, password } = req.body;
      const admin = await Admin.findOne({ userName: userName });
      const accesstoken = await AdminController.GenerateAccessToken(userName, password);
      if (admin && accesstoken) {
        res.status(200).send({ code: 200, message: "Login Successfully", token: accesstoken });
      } else {
        res.status(404).json({ code: 404, message: 'Invalid Access Token or User' });
      }
    }
    catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


  app.post("/api/user-create",errorHandler,verifyJWT,isAdmin,async(req,res,next)=>{
    try {
      const user =req.body;
      await AdminController.createUser(req.body,user)
      res.status(200).send({ code: 200, message: 'User registered successfully!' })
    } catch (error) {
        next(error);
      // res.status(500).send({ code: error.code, message: error.message })
    }
  })

app.post("/api/user-login",async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName: userName });
    const accesstoken = await AdminController.loginUser(userName, password);
    if (user && accesstoken) {
      res.status(200).send({ code: 200, message: "Login Successfully", token: accesstoken });
    } else {
      res.status(404).json({ code: 404, message: 'Invalid Access Token or User' });
    }
  }
  catch (error) {
    res.status(500).send({ code: error.code, message: error.message })
  }
})



  app.post("/api/create-games",errorHandler,notFound,verifyJWT,isAdmin, async (req, res ,next) => {
    try {    
     const { gameName  ,Description} = req.body
     const games = await AdminController.createGame( gameName  ,Description)
     res.status(200).send({ code: 200, message: "Game Create Successfully", games })

    } catch (err) {
      // res.status(500).send({ code: err.code, message: err.message })
      next(err);
    }
  })

  app.post("/api/create-markets/:gameId",Authorize(["Admin"]), async (req, res) => {
    try {
      const {gameId} = req.params;
      console.log(gameId)
     const { marketName , participants , timeSpan } = req.body
     const markets = await AdminController.createMarket( gameId ,marketName ,participants , timeSpan)
     res.status(200).send({ code: 200, message: "Market Create Successfully", markets })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })


  app.post("/api/create-runners/:gameId/:marketId",Authorize(["Admin"]), async (req, res) => {
    try {
      const {gameId, marketId,} = req.params;
     const {runnerNames } = req.body
     const runners = await AdminController.createRunner( gameId, marketId, runnerNames)
     res.status(200).send({ code: 200, message: "Runner Create Successfully", runners })

    } catch (err) {
      res.status(500).send({ code: err.code, message: err.message })
    }
  })

  app.post("/api/create-Rate/:gameId/:marketId/:runnerId",errorHandler,Authorize(["Admin"]), async (req, res, next) => {
    try {
     const {gameId, marketId, runnerId,} = req.params;
     const {back , lay } = req.body
     const rates = await AdminController.createRate( gameId, marketId, runnerId, back, lay)
     res.status(200).send({ code: 200, message: "Rate Create Successfully", rates })

    } catch (err) {
      // res.status(500).send({ code: err.code, message: err.message })
      next(err)
    }
  })

  app.get("/api/All-Games",Authorize(["Admin"]), async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
      const searchQuery = req.query.search || '';

      const admins = await Admin.find();
  
      if (!admins || admins.length === 0) {
        throw { code: 404, message: "Admin not found" };
      }
  
      const gameData = admins.flatMap((admin) =>
        admin.gameList.map((game) => ({
          gameId: game.gameId,
          gameName: game.gameName,
          Description: game.Description,
        }))
      );
  
      const filteredGameData = gameData.filter(game =>
       game.gameName && game.gameName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
      const totalItems = filteredGameData.length;
  
      let paginatedGameData;
      let totalPages = 1;
  
      if (page && pageSize) {
        totalPages = Math.ceil(totalItems / pageSize);
        paginatedGameData = filteredGameData.slice(
          (page - 1) * pageSize,
          page * pageSize
        );
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
        message: error.message || "Internal Server Error",
      });
    }
  });

  
  app.get("/api/All-Markets/:gameId",Authorize(["Admin"]), async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const searchQuery = req.query.search || '';
  
      const admins = await Admin.findOne(
        { "gameList.gameId": gameId },
        { _id: 0, gameList: { $elemMatch: { gameId: gameId } } }
      ).exec();
  
      if (!admins || !admins.gameList || !Array.isArray(admins.gameList)) {
        throw { code: 404, message: "Game not found" };
    }
    console.log("first",admins)
  
      const marketDetails = admins.gameList.flatMap((game) =>
        game.markets.filter((market) =>
        market.marketName && market.marketName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(market => ({
          marketId: market.marketId,
          marketName: market.marketName,
          timeSpan: market.timeSpan,
          participants: market.participants,
          status : market.status
        }))
      );
  
      const marketData = [].concat(...marketDetails);
  
      let paginatedMarketData;
      let totalPages = 1;
  
      if (page && pageSize) {
        const totalItems = marketData.length;
        totalPages = Math.ceil(totalItems / pageSize);
  
        paginatedMarketData = marketData.slice(
          (page - 1) * pageSize,
          page * pageSize
        );
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
        message: error.message || "Internal Server Error",
      });
    }
});


app.get("/api/All-Runners/:gameId/:marketId", Authorize(["Admin"]), async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const marketId = new mongoose.Types.ObjectId(req.params.marketId); 
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchQuery = req.query.search || '';

    console.log("Received request for gameId:", gameId, "and marketId:", marketId);


    const admin = await Admin.findOne({
      "gameList.gameId": gameId,
      "gameList.markets.marketId": marketId
    }, { _id: 0, "gameList.$": 1 });
    console.log("Admin found:", admin);

    if (!admin || !admin.gameList || admin.gameList.length === 0) {
      throw { code: 404, message: "Game not found for the specified Admin" };
    }

    const game = admin.gameList[0];
    console.log("Game found:", game);

    const market = game.markets.find(m => m.marketId.equals(marketId));
    console.log("Market found:", market);

    if (!market) {
      throw { code: 404, message: "Market not found for the specified Game" };
    }

    const filteredRunners = market.runners.filter(runner =>
      runner.runnerName.name && runner.runnerName.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalItems = filteredRunners.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedRunners = filteredRunners.slice((page - 1) * pageSize, page * pageSize);

    const runnerNamesList = paginatedRunners.map(runner => ({
      runnerId : runner.runnerName.runnerId,
      runnerName: runner.runnerName.name,
      rates: runner.rate.map(rate => ({
        Back: rate.Back,
        Lay: rate.Lay
      }))
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
      message: error.message || "Internal Server Error",
    });
  }
});


  app.post("/api/update-market-status/:marketId", async (req, res) => {
    try {
        const { marketId } = req.params;
        const { status } = req.body;

        const result = await AdminController.checkMarketStatus(marketId, status);

        res.status(200).json(result);
    } catch (error) {
        console.error(error);

        if (error.message === "Market not found." || error.message === "Invalid status format. It should be a boolean.") {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Internal server error." });
    }
});

// app.post('/api/Root-Path/:action',
//     async (req, res) => {
//         const { action } = req.params;
//         let { gameName, marketName, runnerName } = req.query;
//         try {
//             const result = await AdminController.buildRootPath(gameName, marketName, runnerName, action);
//             res.status(200).json(result);
//         } catch (error) {
//             res.status(error.code || 500).json({ error: error.message || 'Internal Server Error' });
//         }
//     });


app.get("/api/All-User", async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const searchQuery = req.query.search || '';

    const users = await User.find();

    if (!users || users.length === 0) {
      throw { code: 404, message: "User not found" };
    }

    const filteredUsers = users.filter(user =>
      (user.userName && user.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      
    );

    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

    res.status(200).send({
      users: paginatedUsers,
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
    });
  } catch (error) {
    res.status(error.code || 500).send({
      code: error.code || 500,
      message: error.message || "Internal Server Error",
    });
  }
});


app.put("/api/update", Authorize(["Admin"]), async (req, res) => {
  try {
      const { gameId, marketId, runnerId } = req.query;
      const { gameName, description, marketName, participants, timeSpan, RunnerName, back, lay } = req.body;

      const admin = await Admin.findOne({ roles: "Admin" });

      if (!admin) {
          throw { code: 404, message: "Admin not found" };
      }

      if (gameId) {
          await AdminController.updateGame(admin, gameId, gameName, description);
      }

      if (marketId) {
          await AdminController.updateMarket(admin, gameId, marketId, marketName, participants, timeSpan);
      }

      if (runnerId) {
          await AdminController.updateRunner(admin, gameId, marketId, runnerId, RunnerName);
          await AdminController.updateRate(admin, gameId, marketId, runnerId, back, lay);
      }

      await admin.save();

      res.json({
          success: true,
          message: "Edit successful",
          gameList: admin.gameList,
      });
  } catch (error) {
      res.status(error.code || 500).json({
          success: false,
          message: error.message || "Internal Server Error",
      });
  }
});


app.post("/api/admin/slider-text-img/dynamic", Authorize(["Admin"]), async (req, res) => {
  try {
    const { sliderCount, data } = req.body; // Destructure the required fields
    const createSlider = await AdminController.CreateSlider(sliderCount, data, req.user); // Pass the required fields directly
    if (createSlider) {
      res.status(201).send("Slider and text Created Successful");
    }
  } catch (e) {
    console.error(e);
    res.status(e.code || 500).send({ message: e.message || "Internal Server Error" }); // Fallback to generic error response
  }
});






}