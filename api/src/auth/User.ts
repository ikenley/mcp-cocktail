export default class User {
  constructor(public id: string, public email: string) {}

  public static fromIdToken(decodedJwt: any) {
    const id = decodedJwt.sub;
    const email = decodedJwt.email;

    return new User(id, email);
  }
}
