export default function LoginPage() {
    return (
        <section id="login-page" className="auth">
            <form>

                <div className="container">

                    <input type="email" name="email" placeholder="Имейл" />
                    <input type="password" name="password" placeholder="Парола" />
                    <input type="submit" className="btn submit" value="Login" />
                </div>
            </form>
        </section>
    );
}