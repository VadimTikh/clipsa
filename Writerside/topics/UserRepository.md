# UserRepository
__store__ - метод сохранения нового пользователя
```php
    public function store(UserStoreDTO $userStoreDTO)
    {
        return DB::table('users')
            ->insert([
                "name" => $userStoreDTO->getName(),
                "email" => $userStoreDTO->getEmail(),
                "email_verified_at" => now(),
                "password" => $userStoreDTO->getPassword(),
                "group" => $userStoreDTO->getGroup()->name,
                "access" => $userStoreDTO->isStatus(),
                'google_id' => 0
            ]);
    }
```

