<Query Kind="Program">
  <NuGetReference>PhotoSauce.MagicScaler</NuGetReference>
  <NuGetReference Prerelease="true">SixLabors.ImageSharp</NuGetReference>
  <Namespace>SixLabors.ImageSharp</Namespace>
  <Namespace>SixLabors.ImageSharp.Formats.Jpeg</Namespace>
  <Namespace>SixLabors.ImageSharp.Metadata.Profiles.Exif</Namespace>
  <Namespace>SixLabors.ImageSharp.PixelFormats</Namespace>
  <Namespace>SixLabors.ImageSharp.Processing</Namespace>
</Query>

const double PanoramaRatio = 1.6;

void Main(string[] args)
{
	//args.Dump();
	// args:
	// 	root: directory to process, current one if not given
	//	fakeIt: whether to actually change things, defaults to false; can take true/false/yes/no/y/n
	//  help: shows argument list; takes help/h/?
	var folder = "";
    folder = @"d:\pix\nesortate\";
	var mover = new Mover(true);
	mover.SplitFilesToFoldersByDate(folder);
}

class Mover
{
	public readonly string[] PhotoExtensions = new string[] { "jpeg", "jpg" };
	public readonly string[] MovieExtensions = new string[] { "mp4" };
	
	string fullFilePath;
	string directory;
	string newDirectory;
	string filename;
	string newFilename;
	string extension;
	bool isPanorama;
	bool doIt;
	DateTime? shootingDate;

	public Mover() : this(false) { }
	public Mover(bool doIt) { this.doIt = doIt; }

	public void UpdateFoldersNamesByPhotoDates(string root)
	{
		foreach (var folder in Directory.EnumerateDirectories(root, "20??.?? *", SearchOption.TopDirectoryOnly))
		{
			Console.WriteLine(folder);
			string newFolder = null;
			var folderName = Path.GetFileName(folder);
			foreach (var file in Directory.EnumerateFiles(folder))
			{
				fullFilePath = file;
				filename = Path.GetFileNameWithoutExtension(file).Trim();
				var dateTime = ExtractDateFromPhoto();
				if (dateTime != null && dateTime != DateTime.MinValue)
				{
					newFolder = Path.Combine(root, $"{dateTime.Value.ToString("yyyy.MM.dd")} {folderName.Substring(7)}");
					Console.WriteLine("Found " + newFolder);
					break;
				}
			}
			if (newFolder != null)
			{
				var regex = new Regex(@"\s{2,}");
				while (regex.IsMatch(newFolder))
				{
					newFolder = regex.Replace(newFolder, " ");
				}
				Directory.Move(folder, newFolder);
			}
			else
			{
				Console.WriteLine("Could not find date for " + folder);
			}
		}
	}

	public void SplitFilesToFoldersByDate(string root)
	{
		Console.WriteLine(doIt ? "Actually moving files" : "NOT moving files");
		Console.WriteLine("\n");
		var files = Directory.EnumerateFiles(root);
		foreach (var file in files) // "c:\work\pix\nesortate\Moto\mici\IMG_20170315_132557065.jpg"
		{
			try
			{
				fullFilePath = file;
				directory = Path.GetDirectoryName(fullFilePath);
				filename = Path.GetFileName(fullFilePath); // "IMG_20170315_132557065.jpg"
				extension = Path.GetExtension(filename).Substring(1);

				shootingDate = ExtractDateFromFile();
				if (shootingDate == null)
				{
					Console.WriteLine($"Skipping '{fullFilePath}': could not retrieve shooting date.");
					continue;
				}

				MakeSureDirExists();

				newFilename = Path.Combine(newDirectory, filename);

				MoveFile(file, newFilename);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Exception for {fullFilePath}: {ex.Message}\n{ex.StackTrace}");
			}
		}
		Console.WriteLine("Done!");
	}

	DateTime? ExtractDateFromFile()
	{
		if (PhotoExtensions.Contains(extension.ToLowerInvariant()))
			return ExtractDateFromPhoto();
		if (MovieExtensions.Contains(extension.ToLowerInvariant()))
			return ExtractDateFromMovie();
		return null;
	}

	DateTime? ExtractDateFromMovie()
	{
		return GetShootingDateFromName();
	}

	DateTime? ExtractDateFromPhoto()
	{
		var result = GetShootingDateFromName();
		if (result == null)
		{
			try
			{
				var bytes = File.ReadAllBytes(fullFilePath);
				var image = Image.Load(bytes);
				//var image = Image.Load(bytes) as SixLabors.ImageSharp.Image<Rgba32>;
				var profile = image.Metadata.ExifProfile;
				isPanorama = IsPanorama(profile);
				result = GetShootingDateFromExif(profile);
			}
			catch (Exception exc)
			{
				return null;
			}
		}
		return result;
	}

	DateTime? GetShootingDateFromName()
	{
		var yearRegex = new Regex("^(IMG_|PXL_)?(?<date>20[\\d]{6})_?", RegexOptions.IgnoreCase);
		var match = yearRegex.Match(filename);
		if (match.Success)
		{
			var dateString = match.Groups["date"].Value;
			return new DateTime(Int32.Parse(dateString.Substring(0, 4))
				, Int32.Parse(dateString.Substring(4, 2))
				, Int32.Parse(dateString.Substring(6, 2)));
		}
		return null;
	}

	DateTime? GetShootingDateFromExif(ExifProfile exifProfile)
	{
		var date = exifProfile.Values.FirstOrDefault(e => e.Tag == ExifTag.DateTimeOriginal);
		// System.Globalization.CultureInfo.GetCultures(System.Globalization.CultureTypes.AllCultures).First() .Select(e => new { Df = e.DateTimeFormat, N = e.DisplayName, D = e.EnglishName, Na = e.Name })
		if (date != null) // BLEAH
		{
			var dateString = date.GetValue().ToString().Substring(0, 10).Replace(':', '/');
			DateTime.TryParse(dateString, out DateTime result);
			return result;
		}
		return null;
	}

	void MoveFile(string from, string to)
	{
		string message = null;
		var fromForLogging = Path.GetFileName(from);
		var toForLogging = Path.GetDirectoryName(to).Split('\\').Last();
		if (!doIt)
		{
			message = $"NOT Moving {fromForLogging} to {toForLogging}";
		}
		else
		{
			if (File.Exists(to))
			{
				message = $"File {to} exists, skipping.";
			}
			else
			{
				message = $"Moving {fromForLogging} to {toForLogging}";
				File.Move(from, to);
			}
		}
		Console.WriteLine(message);
	}

	string MakeSureDirExists()
	{
		var year = shootingDate.Value.Year;
		var month = shootingDate.Value.Month;
		var day = shootingDate.Value.Day;
		var requestedActualDir = $"{year}.{month:D2}.{day:d2}";
		newDirectory = Path.Combine(directory, requestedActualDir);

		if (!Directory.Exists(newDirectory))
		{
			string actualDirname = null;
			var existingDirs = Directory.EnumerateDirectories(directory, requestedActualDir + "*");
			if (existingDirs.Any())
			{
				if (existingDirs.Count() == 1)
				{
					actualDirname = existingDirs.First();
				}
			}
			else
			{
				actualDirname = newDirectory;
			}
			if (actualDirname != null)
			{
				if (isPanorama)
				{
					newDirectory = Path.Combine(newDirectory, "pano");
				}

				Console.WriteLine($"Creating folder {newDirectory}");
				if (doIt)
				{
					Directory.CreateDirectory(newDirectory);
				}
			}
			return actualDirname;
		}
		return null;
	}

	bool IsPanorama(ExifProfile exifProfile)
	{
		var width = (Number)(exifProfile.Values.FirstOrDefault(e => e.Tag == ExifTag.PixelXDimension)?.GetValue());
		var height = (Number)(exifProfile.Values.FirstOrDefault(e => e.Tag == ExifTag.PixelYDimension)?.GetValue());
		var longer = (int)width;
		var shorter = (int)height;
		if (longer < shorter)
		{
			var temp = longer;
			longer = shorter;
			shorter = temp;
		}
		return longer / shorter > PanoramaRatio;
	}
}