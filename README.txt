Web Climate Lab v1.1, Copyright 2017 MIT Joint Program on the Science and Policy of Global Change
Created by Lincoln Berkley (lberkley@mit.edu / lincoln.berkley@gmail.com) and Benjamin Choi (benchoi@mit.edu / choiben314@gmail.com) under the direction of Dr. Erwan Monier and Dr. Benjamin Brown-Steiner at the MIT Joint Program on the Science and Policy of Global Change.

How to install:
1. Create a new database in your SQL server.
2. Import the .sql file that should be included with this website code the new
database.
3. Rename conf_example.php (in the WebClimateLab folder) to conf.php and fill in
your SQL login and database information. Make sure to add conf.php to .gitignore if you plan to push changes to a public Git repository.
4. Upload the included WebClimateLab folder to your web
server in the intended location. For instance, if the folder is uploaded to
example.edu at <web_root>/folder1/folder2/ it will be available at
example.edu/folder1/folder2/WebClimateLab/index.php You can rename the
WebClimateLab folder and the URL will be updated accordingly.