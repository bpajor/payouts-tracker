export const getHome = (req, res, next) => {
  console.log('render home');  
   res.render("user/home", {pageTitle: 'Strona główna'});
  };
  