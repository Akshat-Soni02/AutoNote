export const appendToken = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader.split(' ')[1];
        req.token = accessToken;
        next();
    } catch (error) {
        return res.status(400).json({message: "Invalid Token"});
    }
}