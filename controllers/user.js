export const getHome = (req, res, next) => {
   console.log(req.user);  
   res.render("user/home", {pageTitle: 'Strona główna'});
  };
  