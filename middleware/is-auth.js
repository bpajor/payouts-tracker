export const isAuth = (req, res, next) => {
    const authUrls = ['/signup', '/login'];
    console.log(req.session.isLoggedIn);
    if (!req.session.isLoggedIn) {
        authUrls.forEach(url => {
            if (req.url === url) {
                return next();
            }
        })
        return res.redirect('/login');
    }
    authUrls.forEach(url => {;
        if (req.url === url) {
            return res.redirect('/');
        }
    })
    next();
}