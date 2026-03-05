import { Data } from "../models/data";
import { JOB } from "../functions/logger";
import { FDB } from "../config/databases/firebird";
import { getCuantiaDepartaments, setCatAndSubImgs } from "../functions/exptDptImgs";
const Firebird = new FDB();
const Logger = new JOB("exptDptImgs");

export default function () {
  return new Promise(async (resolve, reject) => {
    try {
      await Firebird.connect();
      const localData = await Data.findOne({}).lean();

      const { Categories, Subcategories } = await getCuantiaDepartaments(
        localData.token
      );
      //subcategories
      let String = JSON.stringify(Subcategories);
      String = String.replace(/[\[]/g, "(");
      String = String.replace(/[\]]/g, ")");
      String = String.replace(/["]/g, "'");
      const subcat_sql = `select codigo, nombre, foto from pos_departamento where nombre in ${String}`;
      const SubImgs = await Firebird.query(subcat_sql);
      const SubsFound = {};
      for (const img of SubImgs) {
        if (img.FOTO) {
          SubsFound[img.NOMBRE] = img.FOTO;
        }
      }

      const SubsToSend = [];
      for (const SUB in SubsFound) {
        SubsToSend.push({
          nombre: SUB,
          img: await Firebird.buffer(SubsFound[SUB]),
        });
      }

      //categories
      String = JSON.stringify(Categories);
      String = String.replace(/[\[]/g, "(");
      String = String.replace(/[\]]/g, ")");
      String = String.replace(/["]/g, "'");
      const cat_sql = `select codigo, nombre, foto from pos_departamento where nombre in ${String}`;
      const Imgs = await Firebird.query(cat_sql);
      const CatsFound = {};
      for (const img of Imgs) {
        if (img.FOTO) {
          CatsFound[img.NOMBRE] = img.FOTO;
        }
      }
      const CatsToSend = [];
      for (const CAT in CatsFound) {
        CatsToSend.push({
          nombre: CAT,
          img: await Firebird.buffer(CatsFound[CAT]),
        });
      }
      await setCatAndSubImgs({ Categories: CatsToSend, Subcategories: SubsToSend }, localData.token)
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
}
