import { currentUser } from "@clerk/nextjs/server";

export async function getUserFirstName() {
  const user = await currentUser();
  return user?.firstName;
}

export async function getUserLastName() {
  const user = await currentUser();
  return user?.lastName;
}

export async function getUserName() {
  const user = await currentUser();
  return user?.firstName + " " + user?.lastName;
}

export async function getUserEmail() {
  const user = await currentUser();
  return user?.emailAddresses[0].emailAddress;
}
