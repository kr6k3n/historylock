let cache = {
  password: null,
  recoveryAnswer: null,
  recoveryQuestion: null,
  encryptionSalt : null
};

async function loadState() {
  let salt = await getStorage('encryptionSalt');
  if (emptyObj(salt)){
    console.log("salt not set, creating random salt");
    const newSalt = generateSalt(30);
    console.log("new salt", newSalt);
    chrome.storage.local.set({ encryptionSalt : newSalt});
  }
  cache.encryptionSalt = salt;
}
//recovery
const recoveryQuestions = [
    "What is the name of your first pet?",
    "Who was your childhood hero?",
    "Where were your best vacations?",
];

async function handleRecoveryQuestion(stepElement){
  const modal1 = await Swal.fire({
    title: "Pick a recovery question",
    icon: 'question',
    input: 'select',
    inputOptions: recoveryQuestions,
    confirmButtonText: 'Confirm',    
  });
  if (modal1.isDismissed) return false;
  const recoveryQuestion = modal1.value;

  const modal2 = await Swal.fire({
    icon: 'question',
    title: 'Answer your recovery question',
    inputLabel: recoveryQuestions[recoveryQuestion],
    input: 'text',
    confirmButtonText: 'Answer',
    preConfirm : (answer) => {
      if (answer) return answer;
      Swal.showValidationMessage(`Your answer cannot be empty`)
    }
  });
  if (modal2.isDismissed) return false;

  const recoveryAnswer = modal2.value;
  const recoveryAnswerHash = await SHA256(recoveryAnswer, cache.encryptionSalt);
  console.log("encrypted recovery answer:", recoveryAnswerHash);

  chrome.storage.local.set({ recoveryQuestion : recoveryQuestions[recoveryQuestion]}, null);
  chrome.storage.local.set({ recoveryAnswerHash : recoveryAnswerHash }, null);
  
  recoveryQuestionUI(stepElement);
  missingElementsUI();
  Swal.fire({
    position: 'top-end',
    icon: 'success',
    title: 'Your recovery question has been saved',
    showConfirmButton: false,
    timer: 2000
  })
}

async function recoveryQuestionUI(stepElement){
  //check if recovery question exists
  let recovAnswer = await getStorage('recoveryAnswerHash');
  if (emptyObj(recovAnswer)) {
    stepElement.innerText = "1. Set up your recovery question";
    stepElement.classList.remove("validated");
    stepElement.classList.add("missing");
  } else {
    stepElement.innerText = "1. Change your recovery question";
    stepElement.classList.remove("missing");
    stepElement.classList.add("validated");
  }
}

async function getRecoveryAnswer(){
  let recoveryQuestion = await getStorage("recoveryQuestion");
  let recoveryAnswerHash = await getStorage("recoveryAnswerHash");
  let recoveryAnswer = await Swal.fire({
    icon: 'question',
    title: 'Answer your recovery question in order to set/change the password',
    inputLabel: recoveryQuestion,
    input: 'text',
    confirmButtonText: 'Answer',
    preConfirm : async (answer) => {
      if (answer === ""){
        Swal.showValidationMessage(`Please answer the password recovery question`)
        return false;
      };
      //test hash
      let answerHash = await SHA256(answer, cache.encryptionSalt);
      if (answerHash == recoveryAnswerHash){
        return answer;
      } else {
        Swal.showValidationMessage(`Incorrect`);
        await new Promise(r => setTimeout(r, 2000));
        return false;
      }
    }
  })
  if (recoveryAnswer.isDismissed) return null;
  return recoveryAnswer.value;
}

// password
async function handlePasswordSet(stepElement){
  if (emptyObj(await getStorage('recoveryAnswerHash'))) {
    Swal.fire({
      icon:  'error',
      title: 'Please set up your recovery question first',
      showConfirmButton: false,
      timer: 2000
    })
    return false;
  }
  Swal.fire({
    title: 'Enter your password',
    html: `<input type="password" id="pass1" class="swal2-input" placeholder="Password">
          <input type="password" id="pass2" class="swal2-input" placeholder="Confirm Password">`,
    confirmButtonText: 'Confirm password',
    focusConfirm: false,
    preConfirm: () => {
      const pass1 = Swal.getPopup().querySelector('#pass1').value;
      const pass2 = Swal.getPopup().querySelector('#pass2').value;
      if (pass1 && !pass2) {
        Swal.showValidationMessage(`Please confirm your password`);
        return false;
      }
      if (!pass1 || !pass2) {
        Swal.showValidationMessage(`Please fill both fields`);
        return false;
      }
      //at this point passwords should be the same
      //password verification
      if (pass1.length < 5) {
        Swal.showValidationMessage(`Your password should contain at least 7 characters`);
        return false;
      }
      if (!(/\d/.test(pass1))) {
        Swal.showValidationMessage(`Your password should contain at least one number`);
        return false;
      }
      if (!(/[A-Z]/.test(pass1)) || !(/[a-z]/.test(pass1))) {
        Swal.showValidationMessage(`Your password should contain both capital and lowercase characters`);
        return false;
      }
      if (pass1 != pass2) {
        Swal.showValidationMessage(`Please enter matching passwords`);
        return false;
      }
      return pass1
    }
  }).then(async (pass) => {
    if (pass.isDismissed) {
      console.log("password input cancelled");
      return false;
    }
    const recovAnswer = await getRecoveryAnswer();
    if (recovAnswer === null){
      return;
    }
    const encryptedPassword = AESEncrypt(pass.value, recovAnswer, cache.encryptionSalt);
    //re encrypt history if password is changed
    encryptHistory(pass);
    chrome.storage.local.set({ mainPassRecovEncryption : encryptedPassword}, null);
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Your password has been saved',
      showConfirmButton: false,
      timer: 2000
    })
    passwordSetUI(stepElement);
    missingElementsUI();
  })
}

async function passwordSetUI(stepElement) {
  let mainPassRecovEncryption = await getStorage('mainPassRecovEncryption');
  if (mainPassRecovEncryption !== false) {
    stepElement.innerText = "2. Change your password";
    stepElement.classList.remove("missing");
    stepElement.classList.add("validated");
  } else {
    stepElement.innerText = "2. Set up your password";
    stepElement.classList.remove("validated");
    stepElement.classList.add("missing");
  }
}

async function handleHistoryEncryption() {
  console.log("handle history encryption")
}

async function historyEncryptionUI() {
  
}

function checkHistoryCleared() {
  return new Promise((resolve, _) => {
    chrome.history.search({text: '', maxResults: 10}, function(data) {
      //console.log(data);
      resolve(data.length === 0);
    });
  });
}

async function handleUnencryptedHistory(){
  console.log("handle history deletion")
}


async function unencryptedHistoryUI() {
  //console.log("unencryptedHistoryUI");
}


async function missingElementsUI() {
  let missing = 4;
  const recovAnswer   = await getStorage('recoveryAnswerHash');
  const passwordHash  = await getStorage('mainPassRecovEncryption');
  const historyLoaded = await getStorage('historyLoaded');
  const historyClear  = await checkHistoryCleared();
  if (recovAnswer)    missing--;
  if (passwordHash)   missing--;
  if (historyLoaded)  missing--;
  if (historyClear)   missing--;
  let missingElementsText = (missing > 0) ? `${missing} Missing elements` : "You're all set up";
  document.getElementsByClassName("subtitle")[0].innerText = missingElementsText;
}

const HANDLERS = [
  handleRecoveryQuestion,
  handlePasswordSet,
  handleHistoryEncryption,
  handleUnencryptedHistory
]

const uiHANDLERS = [
  recoveryQuestionUI,
  passwordSetUI,
  historyEncryptionUI,
  unencryptedHistoryUI,
]

//ui update loop
setInterval(() => {
  const steps = Array.from(document.getElementsByTagName("step"));
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      uiHANDLERS[i](step);
    }
  missingElementsUI();
}, 5*1000)

window.addEventListener('DOMContentLoaded', async function(){
    await loadState();
    const steps = Array.from(document.getElementsByTagName("step"));
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      step.addEventListener('click', () => HANDLERS[i](step));
      uiHANDLERS[i](step);
    }
    missingElementsUI();
  }
)
