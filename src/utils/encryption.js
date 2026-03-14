import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.REACT_APP_PATIENT_SECRET;

export function encryptId(id) {
    if (!id) {
        throw new Error("Cannot encrypt empty or undefined ID");
    }
    return CryptoJS.AES.encrypt(String(id), SECRET_KEY).toString();
}


export function decryptId(cipher) {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}