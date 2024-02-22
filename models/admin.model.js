import mongoose from "mongoose";

export const Admin = new mongoose.model("admin", new mongoose.Schema({
    userName: { type: String, required:[true,"userName is required"] ,unique: true },
    password: { type: String, required: [true , "password is required" ]},
    roles: [{ type: String, required:[true , "Role Not Found" ], default: 'Admin'}],
    gameList: [
        {
          gameId: { type: mongoose.Schema.Types.ObjectId, unique: true },
          gameName: { type: String },         
          Description : { type: String},
          markets: [
            {
              marketId: { type: mongoose.Schema.Types.ObjectId, unique: true },
              marketName: { type: String },
              participants : {type : Number},
              timeSpan: { type: String},
              status: { type: Boolean , default: true},
              runners: [{
                runnerName: {
                  runnerId: { type: mongoose.Schema.Types.ObjectId, unique: true },
                  name: { type: String, unique: true },
                },
                rate: [{
                  Back: { type: Number },
                  Lay: { type: Number }
                }],
              }],
            },
          ],
        },
      ],
      // path: { type: String },
}), 'admin');
