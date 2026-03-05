import { connectionsInit } from "../functions/connection";
import { Data } from "../models/data";
import { Configs } from "../models/configs";
import { SYSTEM } from "../functions/logger";
import { User } from "../models/user";
import fs from "fs"
import path from "path";
const Logger = new SYSTEM("SYSTEM");

async function init() {
  await connectionsInit(Logger);
  Logger.complete();
  await Logger.save();
  const data = await Data.findOne({});
  if (data != null) {
    console.log("DATA DOCUMENT ALREADY EXIST");
  } else {
    await Data.create({
      token: "",
      correlative: 0,
      credentials: { email: "admin@orinoco.io", password: "13289922" },
    });
    console.log("DATA DOCUMENT CREATED");
  }

  const users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', "users.json"), 'utf8'))

  for (const user of users) {
    if (!!(await User.findOne({ email: user.email }))) {
      console.log(`USER ${user.email} ALREADY EXIST`);
    } else {
      await User.create(user);
      console.log(`USER ${user.email} CREATED`);
    }
  }

  const cuantiaLoginConfig = await Configs.findOne({ nameJob: "cuantiaLogin" });
  if (cuantiaLoginConfig != null) {
    console.log("CUANTIA LOGIN JOB CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "cuantiaLogin",
      cronExpression: "0 0 */8 * * *",
      displayName: "AUTENTICACIÓN",
    });
    console.log("CUANTIA LOGIN JOB CONFIG CREATED");
  }

  // const insertPrsConfig = await Configs.findOne({nameJob:"insertPrs"})
  // if (insertPrsConfig != null){
  //     console.log("INSERT PRS JOB CONFIG CREATED")
  // }else {
  //     await Configs.create({nameJob: "insertPrs", cronExpression: "* * * * *", displayName:"PRESUPUESTOS"})
  //     console.log("INSERT PRS JOB CONFIG CREATED")
  // }

  const actQrsConfig = await Configs.findOne({ nameJob: "actQrs" });
  if (actQrsConfig != null) {
    console.log("CUANTIA LOGIN JOB CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "actQrs",
      cronExpression: "0 0 */48 * * *",
      displayName: "QRS",
    });
    console.log("ACT QRS JOB CONFIG CREATED");
  }

  const actPreciosConfig = await Configs.findOne({
    nameJob: "actPrecios",
  }).lean();
  if (actPreciosConfig != null) {
    console.log("ACT PRECIOS CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "actPrecios",
      cronExpression: "0 */1 * * * *",
      displayName: "PRODUCTOS",
    });
    console.log("ACT PRECIOS CONFIG CREATED");
  }

  const importProductsConfig = await Configs.findOne({
    nameJob: "importProducts",
  }).lean();
  if (importProductsConfig != null) {
    console.log("IMPORT PRODUCTS CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "importProducts",
      cronExpression: "0 */1 * * * *",
      displayName: "IMPORTACIÓN",
    });
    console.log("IMPORT PRODUCTS CONFIG CREATED");
  }

  const auditsConfig = await Configs.findOne({
    nameJob: "audits",
  }).lean();

  if (auditsConfig != null) {
    console.log("IMPORT PRODUCTS CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "audits",
      cronExpression: "0 */1 * * * *",
      displayName: "AUDICIONES",
    });
    console.log("AUDITS CONFIG CREATED");
  }

  const imgsConfig = await Configs.findOne({
    nameJob: "crtImgs",
  }).lean();
  if (imgsConfig != null) {
    console.log("CRT IMAGES CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "crtImgs",
      cronExpression: "0 */1 * * * *",
      displayName: "CREAR IMAGENES",
    });
    console.log("CRT IMAGES CONFIG CREATED");
  }

  const backupsConfig = await Configs.findOne({
    nameJob: "backups",
  }).lean();

  if (backupsConfig != null) {
    console.log("BACKUPS CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "backups",
      cronExpression: "0 */1 * * * *",
      displayName: "RESPALDOS",
    });
    console.log("BACKUPS CONFIG CREATED");
  }

  const openingConfig = await Configs.findOne({
    nameJob: "opening",
  }).lean();

  if (openingConfig != null) {
    console.log("OPENING CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "opening",
      cronExpression: "0 */1 * * * *",
      displayName: "APERTURA",
    });
    console.log("OPENING CONFIG CREATED");
  }

  const closingConfig = await Configs.findOne({
    nameJob: "closing",
  }).lean();

  if (closingConfig != null) {
    console.log("CLOSING CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "closing",
      cronExpression: "0 */1 * * * *",
      displayName: "CIERRE",
    });
    console.log("CLOSING CONFIG CREATED");
  }

  const actTasasConfig = await Configs.findOne({
    nameJob: "actTasas",
  }).lean();

  if (actTasasConfig != null) {
    console.log("ACT TASAS CONFIG ALREADY EXIST");
  } else {
    await Configs.create({
      nameJob: "actTasas",
      cronExpression: "0 */1 * * * *",
      displayName: "TASAS",
    });
    console.log("ACT TASAS CREATED");
  }

  console.log("EL SCRIPT HA FINALIZADO");
  process.exit();
}

init()