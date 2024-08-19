const ITERAS_COOKIE_NAME = 'iteraspass';

window.Iteras = window.Iteras || {};

window.Iteras.isLoggedIn = () => {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${ ITERAS_COOKIE_NAME }=`))
        ?.split('=')[1];

    return cookie != null;
};

window.Iteras.logOutAndReload = () => {
    window.Iteras.logoutFromWall();
    window.location.reload();
};
