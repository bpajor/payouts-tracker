export const isAuth = (req, res, next) => {
    const authUrls = ['/signup', '/login'];
    if (!req.session.isLoggedIn) {
        return next();
    }
    authUrls.forEach(url => {
        console.log(req.url);
        if (req.url === url) {
            return res.redirect('/');
        }
    })
    next();
}