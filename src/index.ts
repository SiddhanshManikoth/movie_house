// Import necessary modules and dependencies.
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define a TypeScript type for a Movie record.
type Movie = Record<{
  id: string;
  title: string;
  description: string;
  producedBy: string;
  directedBy: string;
  mainArtists: Vec<string>;
  duration: string;
  trailerImage: string;
  owner: Principal;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define a TypeScript type for the payload used in creating a Movie.
type MoviePayload = Record<{
  title: string;
  description: string;
  producedBy: string;
  directedBy: string;
  mainArtists: Vec<string>;
  duration: string;
  trailerImage: string;
}>;

// Create a new StableBTreeMap to store Movie objects.
const movieStorage = new StableBTreeMap<string, Movie>(0, 44, 1024);

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to create a new Movie.
export function createMovie(payload: MoviePayload): Result<Movie, string> {
  // Validate payload for missing required fields.
  if (
    !payload.title ||
    !payload.description ||
    !payload.producedBy ||
    !payload.directedBy ||
    !payload.mainArtists ||
    !payload.duration ||
    !payload.trailerImage
  ) {
    return Result.Err<Movie, string>("Missing required fields in the payload");
  }

  // Create a movie object.
  const movie: Movie = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    title: payload.title,
    description: payload.description,
    producedBy: payload.producedBy,
    directedBy: payload.directedBy,
    mainArtists: payload.mainArtists,
    duration: payload.duration,
    trailerImage: payload.trailerImage,
    owner: ic.caller(),
  };

  try {
    // Insert the movie into storage.
    movieStorage.insert(movie.id, movie);

    // Return the created movie object.
    return Result.Ok<Movie, string>(movie);
  } catch (error) {
    return Result.Err<Movie, string>(
      "Error inserting movie into storage: " + error
    );
  }
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to retrieve a Movie by its ID.
export function getMovieById(id: string): Result<Movie, string> {
  // Validate the id parameter.
  if (!id) {
    return Result.Err<Movie, string>("Invalid movie id.");
  }

  try {
    return match(movieStorage.get(id), {
      Some: (movie) => Result.Ok<Movie, string>(movie),
      None: () => Result.Err<Movie, string>(`Movie with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<Movie, string>(
      `An error occurred while retrieving the movie: ${error}`
    );
  }
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to retrieve a Movie by its title.
export function getMovieByTitle(title: string): Result<Movie, string> {
  if (typeof title !== "string") {
    return Result.Err(`Invalid title. Expected a string.`);
  }

  // Retrieve all movies from storage.
  const movies = movieStorage.values();

  if (!movies) {
    return Result.Err("Failed to retrieve movies from storage.");
  }

  // Find the movie with the given title.
  const movie = movies.find((m) => m.title === title);

  if (!movie) {
    return Result.Err(`Movie with title "${title}" not found.`);
  }

  return Result.Ok(movie);
}

// Function to get movies by a specific artist.
$query; // This appears to be an annotation, but it doesn't have a corresponding comment.
export function getMoviesByArtist(artist: string): Result<Vec<Movie>, string> {
  if (typeof artist !== "string") {
    return Result.Err("Invalid artist parameter. Expected a string.");
  }

  if (artist === "") {
    return Result.Err("Artist parameter cannot be empty");
  }

  // Filter movies based on the specified artist.
  const movies = movieStorage
    .values()
    .filter((m) => m.mainArtists.includes(artist));

  if (movies.length === 0) {
    return Result.Err("No movies found for the given artist");
  }

  return Result.Ok(movies);
}

$query; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to retrieve all movies.
export function getAllMovies(): Result<Vec<Movie>, string> {
  try {
    // Retrieve all movies from storage.
    return Result.Ok(movieStorage.values());
  } catch (error) {
    return Result.Err(`Error occurred while retrieving movies: ${error}`);
  }
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to update a Movie by its ID.
export function updateMovie(
  id: string,
  payload: MoviePayload
): Result<Movie, string> {
  // Validate payload for missing required fields.
  if (
    !payload.title ||
    !payload.description ||
    !payload.producedBy ||
    !payload.directedBy ||
    !payload.mainArtists ||
    !payload.duration ||
    !payload.trailerImage
  ) {
    return Result.Err<Movie, string>("Missing required fields in the payload");
  }

  return match(movieStorage.get(id), {
    Some: (existingMovie) => {
      // Create an updated Movie object.
      const updatedMovie: Movie = {
        ...existingMovie,
        title: payload.title,
        description: payload.description,
        producedBy: payload.producedBy,
        directedBy: payload.directedBy,
        mainArtists: payload.mainArtists,
        duration: payload.duration,
        trailerImage: payload.trailerImage,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Insert the updated movie into storage.
        movieStorage.insert(updatedMovie.id, updatedMovie);
      } catch (error) {
        // Handle the error here, e.g., log the error or return an error message.
        return Result.Err<Movie, string>(
          `Error occurred while inserting movie with id=${id}`
        );
      }

      // Return the updated movie object.
      return Result.Ok<Movie, string>(updatedMovie);
    },
    None: () => Result.Err<Movie, string>(`Movie with id=${id} not found.`),
  });
}

$update; // This appears to be an annotation, but it doesn't have a corresponding comment.

// Function to delete a Movie by its ID.
export function deleteMovie(id: string): Result<Movie, string> {
  return match(movieStorage.get(id), {
    Some: (existingMovie) => {
      // Remove the movie from storage and return it.
      movieStorage.remove(id);
      return Result.Ok<Movie, string>(existingMovie);
    },
    None: () => Result.Err<Movie, string>(`Movie with id=${id} not found.`),
  });
}

// Define a global crypto object with a getRandomValues method.
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
