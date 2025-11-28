using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using StackExchange.Redis;
using Npgsql;
using System.Text.Json;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();

public class Worker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var redis = ConnectionMultiplexer.Connect("redis");
        var db = redis.GetDatabase();
        var pgString = "Host=db;Username=postgres;Password=postgres;Database=votesdb";

        while (!stoppingToken.IsCancellationRequested)
        {
            if (db.ListLength("votes") > 0)
            {
                var value = await db.ListLeftPopAsync("votes");
                var data = JsonSerializer.Deserialize<Dictionary<string, string>>(value);
                
                await using var conn = new NpgsqlConnection(pgString);
                await conn.OpenAsync();
                await using var cmd = new NpgsqlCommand(
                    "INSERT INTO votes (voter_id, vote) VALUES (@id, @vote)", conn);
                cmd.Parameters.AddWithValue("id", data["voter_id"]);
                cmd.Parameters.AddWithValue("vote", data["vote"]);
                await cmd.ExecuteNonQueryAsync();
            }
            await Task.Delay(100, stoppingToken);
        }
    }
}
