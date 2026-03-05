import { Data } from "../models/data";
import { LastProducts } from "../models/lastProducts";
import { JOB } from "../functions/logger";

const Logger = new JOB("clearCache");

export default function () {
  return new Promise(async (resolve, reject) => {
    try {
      await Data.updateOne({},{$set:{correlative:1}})
      await LastProducts.deleteMany({})
      
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
}
