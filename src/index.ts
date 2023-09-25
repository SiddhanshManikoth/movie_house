 
import {$query,$update,Record,StableBTreeMap,Vec,match,Result,nat64,ic,Opt,Principal,} from"azle";
import { v4 as uuidv4 } from "uuid";
  
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
  
  type MoviePayload = Record<{
    title: string;
    description: string;
    producedBy: string;
    directedBy: string;
    mainArtists: Vec<string>;
    duration: string;
    trailerImage: string;
  }>;
  
  const movieStorage = new StableBTreeMap<string, Movie>(0, 44, 1024);
  
  $update;
  export function createMovie(payload: MoviePayload): Result<Movie, string> {
    const movie: Movie = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      ...payload,
      owner: ic.caller(),
    };
  
    movieStorage.insert(movie.id, movie);
    return Result.Ok<Movie, string>(movie);
  }
  
  $query;
  export function getMovie(id: string): Result<Movie, string> {
    return match(movieStorage.get(id), {
      Some: (movie) => Result.Ok<Movie, string>(movie),
      None: () => Result.Err<Movie, string>(`Movie with id=${id} not found.`),
    });
  }
  
  $query;
export function getMovieByTitle(title: string): Result<Movie, string> {
  const movie = movieStorage.values().find((m) => m.title === title);

  if (!movie) {
    return Result.Err(`Movie with title "${title}" not found.`);
  }

  return Result.Ok(movie);
}

// Function to get movies by artist
$query;
export function getMoviesByArtist(artist: string): Result<Vec<Movie>, string> {
  const movies = movieStorage.values().filter((m) =>
    m.mainArtists.includes(artist)
  );

   return Result.Ok(movies);

}

  $query;
  export function getAllMovies(): Result<Vec<Movie>, string> {
    return Result.Ok(movieStorage.values());
  }
  
  $update;
  export function updateMovie(
    id: string,
    payload: MoviePayload
  ): Result<Movie, string> {
    return match(movieStorage.get(id), {
      Some: (existingMovie) => {
        const updatedMovie: Movie = {
          ...existingMovie,
          ...payload,
          updatedAt: Opt.Some(ic.time()),
        };
  
        movieStorage.insert(updatedMovie.id, updatedMovie);
        return Result.Ok<Movie, string>(updatedMovie);
      },
      None: () => Result.Err<Movie, string>(`Movie with id=${id} not found.`),
    });
  }
  
  $update;
  export function deleteMovie(id: string): Result<Movie, string> {
    return match(movieStorage.get(id), {
      Some: (existingMovie) => {
        movieStorage.remove(id);
        return Result.Ok<Movie, string>(existingMovie);
      },
      None: () => Result.Err<Movie, string>(`Movie with id=${id} not found.`),
    });
  }
  
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