function genHistoryEncryptionKey(mainPassword){
  return nacl.box.fromSecretKey(mainPassword).publicKey;
}


function AESEncrypt(message, encryptionKey, salt){
  return CryptoJS.AES.encrypt(message+salt, encryptionKey).toString()
}

function AESDecrypt(encrypted, encryptionKey, salt){
  CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(CryptoJS.enc.Utf8).slice(0,salt.length)
}


async function SHA256(message, salt){
  const encoder = new TextEncoder();
  const data = encoder.encode(message + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}


const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789)]°%ùµ$£¤^!§:/;.,?&é~#'{([-|è`_ç^à@}";


function generateSalt(length){
  return Array(length).join().split(',')
                      .map(function() { 
                        return alphabet.charAt(Math.floor(Math.random() * alphabet.length)); 
                      }).join('');
}


function encryptHistory(password) {

}