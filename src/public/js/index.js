                                     
  

 /*  reCaptchat  */

  function onSubmit(token) {
      let response = grecaptcha.getResponse();
      document.getElementById("forgotten").submit();
  }



  function onSubmitSignin(token) {
      let response = grecaptcha.getResponse();
      document.getElementById("signin").submit();
  }



  function onSubmitSignup(token) {
      let response = grecaptcha.getResponse();
      document.getElementById("signup").submit();
  }

  function signinAdmin(token) {
    let response = grecaptcha.getResponse();
    document.getElementById("signinAdmin").submit();
  }

  function signupAdmin(token) {
    let response = grecaptcha.getResponse();
    document.getElementById("signupAdmin").submit();
  }




/*  reCaptchat  */



