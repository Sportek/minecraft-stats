export const register = async (username: string, email: string, password: string) => {
  const response = await fetch("/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  if (!response.ok) {
    throw new Error("Failed to register");
  }
  return response.json();
};
