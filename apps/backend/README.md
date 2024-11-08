# install dependencies
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt

update .env in api/

# run migrations
python manage.py migrate

# run server
python manage.py runserver

---

# create migrations
python manage.py makemigrations