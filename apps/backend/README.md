# install dependencies

```
brew install poetry
poetry install
poetry shell
```

update .env in api/

# run server
```
poetry run python manage.py runserver
```

---

# run migrations

```
poetry run python manage.py migrate
```

# create migrations

```
poetry run python manage.py makemigrations
```
