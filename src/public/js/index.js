                                     
  // ir a la pagina > google.com/recaptcha/about/
  // acceder a V3 Admin Console  (hacer esto con la cuenta de google scorpinosred@gmail.com)

 /*  reCaptchat  */

  function forgottenpassw(token) { 
      let response = grecaptcha.getResponse();
      document.getElementById("forgotten").submit(); //este id es el id del formulario, cuando reciba la respuesta de google recatchar este envia el formulario.
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



