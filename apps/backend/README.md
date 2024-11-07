# install dependencies
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt


# run server
python manage.py runserver