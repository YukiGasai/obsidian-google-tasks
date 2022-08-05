//===================
//GETTER
//===================

/**
 * getAccessToken from LocalStorage
 * @returns googleAccessToken
 */
export const getAT = (): string => {
	return window.localStorage.getItem("googleTaskAccessToken") ?? "";
};

/**
 * getRefreshToken from LocalStorage
 * @returns googleRefreshToken
 */
export const getRT = (): string => {
	return window.localStorage.getItem("googleTaskRefreshToken") ?? "";
};

/**
 * getExpirationTime from LocalStorage
 * @returns googleExpirationTime
 */
export const getET = (): number => {
	const expirationTimeString =
		window.localStorage.getItem("googleTaskExpirationTime") ?? "0";
	return parseInt(expirationTimeString, 10);
};

//===================
//SETTER
//===================

/**
 * set AccessToken into LocalStorage
 * @param googleAccessToken googleAccessToken
 * @returns googleAccessToken
 */
export const setAT = (googleAccessToken: string) => {
	window.localStorage.setItem("googleTaskAccessToken", googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRT = (googleRefreshToken: string) => {
	window.localStorage.setItem("googleTaskRefreshToken", googleRefreshToken);
};

/**
 * set ExpirationTime from LocalStorage
 * @param googleExpirationTime googleExpirationTime
 * @returns googleExpirationTime
 */
export const setET = (googleExpirationTime: number) => {
	window.localStorage.setItem(
		"googleTaskExpirationTime",
		googleExpirationTime + ""
	);
};
