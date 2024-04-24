import ipfs from "./ipfsLogic.js";
import imageLogic from "../../media/logic/imageLogic.js";
import models from "../../../models/index.js";
import { IPFS_TYPES } from "../constants/ipfsTypes.js";

const { IPFSEntry } = models;
const backupLogic = {
  async backupImageToIPFS(filename, publicKey, type) {
    const buffer = imageLogic.readImage(filename);
    const result = await ipfs.addFile(buffer);
    if (!IPFS_TYPES[type]) throw TypeError(`Unknown type: ${type}`);
    return IPFSEntry.create({
      type,
      hash: result.path,
      reference: publicKey,
    });
  },
};
export default backupLogic;
