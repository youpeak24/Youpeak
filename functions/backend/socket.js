"use strict";
const db = require("./util/connection");
const moment = require("moment-timezone");

module.exports = function (io) {
  io.on("connect", async (socket) => {
    console.log("Socket Connection done: ", socket.id);

    const { liveRoom } = socket.handshake.query;
    const id = liveRoom && liveRoom.split(":")[1];

    const initiatedSockets = await io.in(liveRoom).fetchSockets();
    if (initiatedSockets.length === 0 && id && id !== "null") {
      socket.join(liveRoom);
    }

    socket.on("liveRoomConnect", async (data) => {
      try {
        const parsedData = JSON.parse(data);
        const sockets = await io.in(liveRoom).fetchSockets();
        if (sockets?.length) {
          sockets[0].join("liveUserRoom:" + parsedData.liveHistoryId);
        }
        io.in("liveUserRoom:" + parsedData.liveHistoryId).emit("liveRoomConnect", data);
      } catch (e) {
        console.error("liveRoomConnect error:", e);
      }
    });

    socket.on("addView", async (data) => {
      try {
        const dataOfaddView = JSON.parse(data);
        const sockets = await io.in(liveRoom).fetchSockets();

        if (sockets?.length) {
          const s = sockets[0];
          const targetRoom = "liveUserRoom:" + dataOfaddView.liveHistoryId;
          if (!s.rooms.has(targetRoom)) {
            await s.join(targetRoom);
          }
        }

        const user = await db.findById("users", dataOfaddView.userId);
        const liveUser = await db.findOne("liveUsers", { liveHistoryId: dataOfaddView.liveHistoryId });

        if (user && liveUser) {
          const existLiveView = await db.findOne("liveViews", {
            userId: dataOfaddView.userId,
            liveHistoryId: dataOfaddView.liveHistoryId,
          });

          if (!existLiveView) {
            await db.create("liveViews", {
              userId: dataOfaddView.userId,
              liveHistoryId: dataOfaddView.liveHistoryId,
              fullName: user.fullName || "",
              nickName: user.nickName || "",
              image: user.image || "",
            });
          }
        }

        const liveViews = await db.find("liveViews", { liveHistoryId: dataOfaddView.liveHistoryId });
        if (liveUser) {
          await db.update("liveUsers", liveUser._id || liveUser.id, { view: liveViews.length });
        }

        io.in("liveUserRoom:" + dataOfaddView.liveHistoryId).emit("addView", liveViews.length);
      } catch (e) {
        console.error("addView error:", e);
      }
    });

    socket.on("lessView", async (data) => {
      try {
        const dataOflessView = JSON.parse(data);
        const sockets = await io.in(liveRoom).fetchSockets();

        if (sockets?.length) {
          const s = sockets[0];
          const targetRoom = "liveUserRoom:" + dataOflessView.liveHistoryId;
          if (s.rooms.has(targetRoom)) {
            await s.leave(targetRoom);
          }
        }

        const existLiveView = await db.findOne("liveViews", {
          userId: dataOflessView.userId,
          liveHistoryId: dataOflessView.liveHistoryId,
        });

        if (existLiveView) {
          await db.delete("liveViews", existLiveView._id || existLiveView.id);
        }

        const liveViews = await db.find("liveViews", { liveHistoryId: dataOflessView.liveHistoryId });
        const liveUser = await db.findOne("liveUsers", { liveHistoryId: dataOflessView.liveHistoryId });
        if (liveUser) {
          await db.update("liveUsers", liveUser._id || liveUser.id, { view: liveViews.length });
        }

        io.in("liveUserRoom:" + dataOflessView?.liveHistoryId).emit("lessView", liveViews.length);
      } catch (e) {
        console.error("lessView error:", e);
      }
    });

    socket.on("liveChat", async (data) => {
      try {
        const dataOfComment = JSON.parse(data);
        const sockets = await io.in(liveRoom).fetchSockets();

        if (sockets?.length) {
          const s = sockets[0];
          const targetRoom = "liveUserRoom:" + dataOfComment.liveHistoryId;
          if (!s.rooms.has(targetRoom)) {
            await s.join(targetRoom);
          }
        }

        io.in("liveUserRoom:" + dataOfComment?.liveHistoryId).emit("liveChat", data);

        const liveHistory = await db.findById("liveHistories", dataOfComment.liveHistoryId);
        if (liveHistory) {
          await db.update("liveHistories", dataOfComment.liveHistoryId, {
            totalLiveChat: (liveHistory.totalLiveChat || 0) + 1,
          });
        }
      } catch (e) {
        console.error("liveChat error:", e);
      }
    });

    socket.on("endLiveUser", async (data) => {
      try {
        const parsedData = JSON.parse(data);
        const user = await db.findOne("users", { liveHistoryId: parsedData?.liveHistoryId });
        const liveHistory = await db.findById("liveHistories", parsedData?.liveHistoryId);

        if (user && user.isLive && liveHistory) {
          const endTime = moment().tz("Asia/Kolkata").format();
          const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
          const end = moment.tz(endTime, "Asia/Kolkata");
          const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

          await db.update("liveHistories", liveHistory._id || liveHistory.id, { endTime, duration });
          await db.update("users", user._id || user.id, { isLive: false, liveHistoryId: null });

          const liveUser = await db.findOne("liveUsers", { userId: user._id || user.id });
          if (liveUser) await db.delete("liveUsers", liveUser._id || liveUser.id);

          const liveViews = await db.find("liveViews", { liveHistoryId: liveHistory._id || liveHistory.id });
          for (const v of liveViews) {
            await db.delete("liveViews", v._id || v.id);
          }

          io.in("liveUserRoom:" + parsedData?.liveHistoryId).emit("endLiveUser", parsedData);
        }
      } catch (error) {
        console.error("Error in endLiveUser:", error);
      }
    });

    socket.on("disconnect", async (reason) => {
      try {
        if (id && id !== "null" && liveRoom) {
          const sockets = await io.in(liveRoom).fetchSockets();
          if (sockets?.length === 0) {
            const user = await db.findById("users", id);
            if (user && user.isLive) {
              const liveHistory = await db.findById("liveHistories", user.liveHistoryId);
              if (liveHistory) {
                const endTime = moment().tz("Asia/Kolkata").format();
                const start = moment.tz(liveHistory.startTime, "Asia/Kolkata");
                const end = moment.tz(endTime, "Asia/Kolkata");
                const duration = moment.utc(end.diff(start)).format("HH:mm:ss");

                await db.update("liveHistories", liveHistory._id || liveHistory.id, { endTime, duration });
                await db.update("users", user._id || user.id, { isLive: false, liveHistoryId: null });

                const liveUser = await db.findOne("liveUsers", { userId: user._id || user.id });
                if (liveUser) await db.delete("liveUsers", liveUser._id || liveUser.id);

                const liveViews = await db.find("liveViews", { liveHistoryId: liveHistory._id || liveHistory.id });
                for (const v of liveViews) {
                  await db.delete("liveViews", v._id || v.id);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("disconnect handler error:", e);
      }
    });
  });
};
